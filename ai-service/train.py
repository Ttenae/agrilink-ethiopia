import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import transforms, datasets
import timm
import os
import json

# ==================== CONFIGURATION ====================
class Config:
    DATA_DIR = "data/plant_disease"
    MODEL_SAVE_PATH = "models/agrilink_model.pth"
    CLASSES_SAVE_PATH = "models/classes.json"
    
    BATCH_SIZE = 32
    EPOCHS = 10
    LEARNING_RATE = 0.001
    
    DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {DEVICE}")

# ==================== DATASET PREPARATION ====================
def prepare_dataset():
    """Prepare the PlantVillage dataset for training."""
    train_transform = transforms.Compose([
        transforms.RandomResizedCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(10),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    dataset = datasets.ImageFolder(Config.DATA_DIR, transform=train_transform)
    
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(
        dataset, [train_size, val_size]
    )
    
    val_dataset.dataset.transform = val_transform
    
    train_loader = DataLoader(train_dataset, batch_size=Config.BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=Config.BATCH_SIZE, shuffle=False)
    
    return train_loader, val_loader, dataset.classes

# ==================== MODEL LOADING ====================
def load_model(num_classes=38):
    """Load pre-trained EfficientNet and modify for plant diseases."""
    model = timm.create_model('efficientnet_b0', pretrained=True)
    
    for param in model.parameters():
        param.requires_grad = False
    
    in_features = model.classifier.in_features
    model.classifier = nn.Sequential(
        nn.Dropout(0.2),
        nn.Linear(in_features, 512),
        nn.ReLU(),
        nn.Dropout(0.2),
        nn.Linear(512, num_classes)
    )
    
    return model

# ==================== TRAINING ====================
def train_model(model, train_loader, val_loader, epochs=10):
    """Train the model."""
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.classifier.parameters(), lr=Config.LEARNING_RATE)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=3)
    
    best_val_acc = 0
    device = Config.DEVICE
    model = model.to(device)
    
    for epoch in range(epochs):
        model.train()
        train_loss = 0
        correct = 0
        total = 0
        
        for batch_idx, (data, target) in enumerate(train_loader):
            data, target = data.to(device), target.to(device)
            
            optimizer.zero_grad()
            output = model(data)
            loss = criterion(output, target)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            _, predicted = output.max(1)
            total += target.size(0)
            correct += predicted.eq(target).sum().item()
        
        train_acc = 100. * correct / total
        print(f'Epoch {epoch+1}/{epochs}, Train Loss: {train_loss/len(train_loader):.4f}, Train Acc: {train_acc:.2f}%')
        
        model.eval()
        val_loss = 0
        correct = 0
        total = 0
        
        with torch.no_grad():
            for data, target in val_loader:
                data, target = data.to(device), target.to(device)
                output = model(data)
                loss = criterion(output, target)
                
                val_loss += loss.item()
                _, predicted = output.max(1)
                total += target.size(0)
                correct += predicted.eq(target).sum().item()
        
        val_acc = 100. * correct / total
        print(f'Val Loss: {val_loss/len(val_loader):.4f}, Val Acc: {val_acc:.2f}%')
        
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'val_acc': val_acc,
                'classes': val_loader.dataset.dataset.classes
            }, Config.MODEL_SAVE_PATH)
            
            # Save classes to JSON
            with open(Config.CLASSES_SAVE_PATH, 'w') as f:
                json.dump(val_loader.dataset.dataset.classes, f)
            
            print(f'Model saved! (Val Acc: {val_acc:.2f}%)')
        
        scheduler.step(val_loss)
    
    print(f'Training complete! Best Val Acc: {best_val_acc:.2f}%')
    return model

# ==================== MAIN ====================
if __name__ == "__main__":
    print("🚀 Starting AgriLink Disease Detection Training...")
    
    if not os.path.exists(Config.DATA_DIR):
        print("❌ Dataset not found!")
        print(f"Please download PlantVillage dataset to: {Config.DATA_DIR}")
        print("Dataset link: https://www.kaggle.com/datasets/emmarex/plantdisease")
        exit(1)
    
    print("📊 Preparing dataset...")
    train_loader, val_loader, classes = prepare_dataset()
    print(f"✅ Found {len(classes)} disease classes")
    print(f"Classes: {classes[:5]}...")
    
    print("🧠 Loading pre-trained model...")
    model = load_model(num_classes=len(classes))
    print("✅ Model loaded!")
    
    print("🏋️ Starting training...")
    train_model(model, train_loader, val_loader, epochs=Config.EPOCHS)
    
    print("🎉 Training complete!")
    print(f"Model saved to: {Config.MODEL_SAVE_PATH}")