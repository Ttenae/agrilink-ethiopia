# ai-service/train_fixed.py
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import transforms, datasets
from efficientnet_pytorch import EfficientNet
import json
import os
from pathlib import Path
from sklearn.model_selection import train_test_split
import shutil
from tqdm import tqdm
import random

# Set random seed
random.seed(42)
torch.manual_seed(42)

# ============ CONFIGURATION ============
CONFIG = {
    "batch_size": 32,
    "epochs": 30,
    "learning_rate": 0.001,
    "image_size": 224,
    "num_workers": 0,  # IMPORTANT: Set to 0 for Windows!
    "device": "cuda" if torch.cuda.is_available() else "cpu",
    "data_dir": "data/crop care dataset/",
    "train_dir": "data/organized_train/",
    "val_dir": "data/organized_val/",
    "test_dir": "data/organized_test/",
    "model_dir": "models/"
}

def main():
    print(f"🚀 Using device: {CONFIG['device']}")

    # Create directories
    for d in [CONFIG["train_dir"], CONFIG["val_dir"], CONFIG["test_dir"], CONFIG["model_dir"]]:
        Path(d).mkdir(parents=True, exist_ok=True)

    # ============ FIND ALL IMAGES ============
    print("\n📁 Scanning for images...")

    class_folders = [f for f in Path(CONFIG["data_dir"]).iterdir() if f.is_dir()]
    print(f"✅ Found {len(class_folders)} crop/disease folders")

    total_images = 0
    all_classes = []

    for folder in class_folders:
        class_name = folder.name
        all_classes.append(class_name)
        
        images = list(folder.glob("*.png")) + list(folder.glob("*.jpg")) + list(folder.glob("*.jpeg"))
        images += list(folder.glob("*.PNG")) + list(folder.glob("*.JPG")) + list(folder.glob("*.JPEG"))
        
        if not images:
            print(f"   ⚠️ No images in: {class_name}")
            continue
        
        total_images += len(images)
        random.shuffle(images)
        
        train_split = int(0.7 * len(images))
        val_split = int(0.15 * len(images))
        
        train_imgs = images[:train_split]
        val_imgs = images[train_split:train_split + val_split]
        test_imgs = images[train_split + val_split:]
        
        for img in train_imgs:
            dst = Path(CONFIG["train_dir"]) / class_name
            dst.mkdir(exist_ok=True)
            shutil.copy2(img, dst / img.name)
            
        for img in val_imgs:
            dst = Path(CONFIG["val_dir"]) / class_name
            dst.mkdir(exist_ok=True)
            shutil.copy2(img, dst / img.name)
            
        for img in test_imgs:
            dst = Path(CONFIG["test_dir"]) / class_name
            dst.mkdir(exist_ok=True)
            shutil.copy2(img, dst / img.name)
        
        print(f"   {class_name}: {len(train_imgs)} train, {len(val_imgs)} val, {len(test_imgs)} test")

    all_classes = sorted(all_classes)
    with open(os.path.join(CONFIG["model_dir"], "crop_classes.json"), "w") as f:
        json.dump(all_classes, f, indent=2)

    print(f"\n✅ Total images organized: {total_images}")
    print(f"✅ Total classes: {len(all_classes)}")

    # ============ LOAD DATASET ============
    print("\n📊 Loading dataset...")

    data_transforms = {
        'train': transforms.Compose([
            transforms.Resize((CONFIG["image_size"], CONFIG["image_size"])),
            transforms.RandomHorizontalFlip(),
            transforms.RandomRotation(20),
            transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
        'val': transforms.Compose([
            transforms.Resize((CONFIG["image_size"], CONFIG["image_size"])),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
    }

    train_dataset = datasets.ImageFolder(CONFIG["train_dir"], transform=data_transforms['train'])
    val_dataset = datasets.ImageFolder(CONFIG["val_dir"], transform=data_transforms['val'])
    test_dataset = datasets.ImageFolder(CONFIG["test_dir"], transform=data_transforms['val'])

    train_loader = DataLoader(train_dataset, batch_size=CONFIG["batch_size"], shuffle=True, num_workers=CONFIG["num_workers"])
    val_loader = DataLoader(val_dataset, batch_size=CONFIG["batch_size"], shuffle=False, num_workers=CONFIG["num_workers"])
    test_loader = DataLoader(test_dataset, batch_size=CONFIG["batch_size"], shuffle=False, num_workers=CONFIG["num_workers"])

    print(f"✅ Train: {len(train_dataset)} images")
    print(f"✅ Val: {len(val_dataset)} images")
    print(f"✅ Test: {len(test_dataset)} images")
    print(f"✅ Classes: {len(train_dataset.classes)}")

    # ============ TRAIN MODEL ============
    print("\n🔄 Loading EfficientNet-B0...")
    model = EfficientNet.from_pretrained('efficientnet-b0')
    model._fc = nn.Linear(model._fc.in_features, len(train_dataset.classes))
    model = model.to(CONFIG["device"])

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=CONFIG["learning_rate"])
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=5, factor=0.1)

    print("\n🚀 Starting training...")
    best_accuracy = 0.0

    for epoch in range(CONFIG["epochs"]):
        # Training
        model.train()
        train_loss = 0.0
        progress_bar = tqdm(train_loader, desc=f"Epoch {epoch+1}/{CONFIG['epochs']}")
        
        for inputs, labels in progress_bar:
            inputs, labels = inputs.to(CONFIG["device"]), labels.to(CONFIG["device"])
            
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            progress_bar.set_postfix({"loss": f"{loss.item():.4f}"})
        
        avg_train_loss = train_loss / len(train_loader)
        
        # Validation
        model.eval()
        val_loss = 0.0
        correct = 0
        total = 0
        
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(CONFIG["device"]), labels.to(CONFIG["device"])
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                val_loss += loss.item()
                _, predicted = torch.max(outputs, 1)
                total += labels.size(0)
                correct += (predicted == labels).sum().item()
        
        val_accuracy = 100 * correct / total
        avg_val_loss = val_loss / len(val_loader)
        
        scheduler.step(avg_val_loss)
        
        if val_accuracy > best_accuracy:
            best_accuracy = val_accuracy
            torch.save(model.state_dict(), os.path.join(CONFIG["model_dir"], "crop_model.pth"))
            print(f"✅ New best model saved! Accuracy: {best_accuracy:.2f}%")
        
        print(f"Epoch {epoch+1}: Train Loss: {avg_train_loss:.4f}, Val Loss: {avg_val_loss:.4f}, Val Acc: {val_accuracy:.2f}%")
        print(f"   Best accuracy: {best_accuracy:.2f}%")
        print("-" * 50)

    print(f"\n🎉 Training complete! Best validation accuracy: {best_accuracy:.2f}%")

    # ============ TEST MODEL ============
    print("\n📊 Testing best model on test set...")
    model.load_state_dict(torch.load(os.path.join(CONFIG["model_dir"], "crop_model.pth")))
    model.eval()

    test_correct = 0
    test_total = 0

    with torch.no_grad():
        for inputs, labels in test_loader:
            inputs, labels = inputs.to(CONFIG["device"]), labels.to(CONFIG["device"])
            outputs = model(inputs)
            _, predicted = torch.max(outputs, 1)
            test_total += labels.size(0)
            test_correct += (predicted == labels).sum().item()

    test_accuracy = 100 * test_correct / test_total
    print(f"✅ Test accuracy: {test_accuracy:.2f}%")
    print(f"✅ Model saved to: {CONFIG['model_dir']}/crop_model.pth")
    print(f"✅ Classes saved to: {CONFIG['model_dir']}/crop_classes.json")

if __name__ == '__main__':
    main()