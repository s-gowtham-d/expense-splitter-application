import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, PieChart, BarChart3 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Expense Splitter</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Split expenses easily with friends and family
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/groups">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="outline">
                <BarChart3 className="mr-2 h-5 w-5" />
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <Users className="h-12 w-12 mb-4 text-primary" />
              <CardTitle>Create Groups</CardTitle>
              <CardDescription>
                Organize your expenses by creating groups for trips, roommates, or any shared costs
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <DollarSign className="h-12 w-12 mb-4 text-primary" />
              <CardTitle>Track Expenses</CardTitle>
              <CardDescription>
                Add expenses with flexible split options: equal, percentage, or exact amounts
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <PieChart className="h-12 w-12 mb-4 text-primary" />
              <CardTitle>Settle Up</CardTitle>
              <CardDescription>
                Get optimized settlement suggestions to minimize the number of transactions
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
