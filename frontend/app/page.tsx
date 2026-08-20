'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  Shield, 
  Truck, 
  Leaf,
  ArrowRight,
  Star,
  Award,
  Clock,
  BarChart3,
  CheckCircle2
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background pt-20 pb-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0 text-sm px-4 py-1.5">
                🇪🇹 Ethiopia's Trusted Agricultural Marketplace
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                Connect Farmers with
                <span className="block text-primary">Buyers Directly</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg">
                AgriLink Ethiopia bridges the gap between farmers and buyers — 
                eliminating middlemen, ensuring fair prices, and building a transparent 
                agricultural ecosystem.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                <Link href="/auth/register">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Join as Farmer
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="lg" variant="outline">
                    Join as Buyer
                  </Button>
                </Link>
                <Link href="/products">
                  <Button size="lg" variant="outline">
                    Browse Products
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>No middlemen</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Verified farmers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Secure payments</span>
                </div>
              </div>
            </div>
            <div className="relative lg:ml-auto">
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-8 border border-primary/10">
                <div className="grid grid-cols-2 gap-4">
                  <StatCard label="Active Farmers" value="500+" icon={Users} />
                  <StatCard label="Buyers" value="100+" icon={ShoppingBag} />
                  <StatCard label="Products" value="1,000+" icon={Leaf} />
                  <StatCard label="Transaction Value" value="2M+ ETB" icon={TrendingUp} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4" variant="outline">Features</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-muted-foreground">
              A platform designed to revolutionize Ethiopian agriculture with 
              transparency, efficiency, and trust.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={ShoppingBag}
              title="Direct Marketplace"
              description="Farmers list products directly, buyers find verified suppliers without intermediaries."
            />
            <FeatureCard 
              icon={Shield}
              title="Verified Farmers"
              description="All farmers are verified to ensure quality and trust in every transaction."
            />
            <FeatureCard 
              icon={BarChart3}
              title="Fair Pricing"
              description="Transparent pricing with real-time market data for both farmers and buyers."
            />
            <FeatureCard 
              icon={Truck}
              title="Logistics Support"
              description="Integrated logistics to help deliver products efficiently across Ethiopia."
            />
            <FeatureCard 
              icon={Users}
              title="Community Trust"
              description="Build lasting relationships with ratings, reviews, and secure transactions."
            />
            <FeatureCard 
              icon={Award}
              title="Quality Assurance"
              description="Every product is reviewed and rated to maintain high quality standards."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4" variant="outline">How It Works</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Simple Steps to Get Started
            </h2>
            <p className="text-lg text-muted-foreground">
              Join AgriLink and start growing your business in three easy steps.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard 
              number="01"
              title="Create Account"
              description="Sign up as a farmer or buyer and complete your profile."
            />
            <StepCard 
              number="02"
              title="List or Browse"
              description="Farmers list products, buyers browse and find what they need."
            />
            <StepCard 
              number="03"
              title="Connect & Grow"
              description="Connect with buyers/sellers, make transactions, and grow your business."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Transform Agriculture?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join thousands of farmers and buyers already using AgriLink to 
            grow their businesses.
          </p>
          <Link href="/auth/register">
            <Button size="lg" variant="secondary" className="bg-background text-foreground hover:bg-background/90">
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
}

const StatCard = ({ label, value, icon: Icon }: { label: string; value: string; icon: any }) => (
  <div className="bg-background/50 backdrop-blur rounded-lg p-4 text-center border border-border/50">
    <div className="flex justify-center mb-2">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
        <Icon className="h-4 w-4 text-primary" />
      </div>
    </div>
    <div className="text-2xl font-bold">{value}</div>
    <div className="text-sm text-muted-foreground">{label}</div>
  </div>
);

const FeatureCard = ({ icon: Icon, title, description }: any) => (
  <Card className="border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
    <CardHeader>
      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <CardTitle className="text-xl">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <CardDescription className="text-muted-foreground">{description}</CardDescription>
    </CardContent>
  </Card>
);

const StepCard = ({ number, title, description }: any) => (
  <div className="relative">
    <div className="text-5xl font-bold text-primary/10 mb-4">{number}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);