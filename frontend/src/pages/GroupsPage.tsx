import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/api/client';
import { Group } from '@/types';

export default function GroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await api.groups.getAll();
      setGroups(data.groups);
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setCreating(true);
      const result = await api.groups.create({
        name: formData.name,
        description: formData.description || undefined,
      });
      setGroups([result.group, ...groups]);
      setFormData({ name: '', description: '' });
      setOpen(false);
    } catch (error) {
      console.error('Failed to create group:', error);
      alert('Failed to create group. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Groups</h1>
            <p className="text-muted-foreground">
              Manage your expense groups
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateGroup}>
                <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
                  <DialogDescription>
                    Create a group to track shared expenses
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="Weekend Trip"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Optional description..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? 'Creating...' : 'Create Group'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading groups...</p>
          </div>
        ) : groups.length === 0 ? (
          <Card>
            <CardHeader className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <CardTitle>No groups yet</CardTitle>
              <CardDescription>
                Create your first group to start tracking expenses
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <Card
                key={group.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/groups/${group.id}`)}
              >
                <CardHeader>
                  <CardTitle>{group.name}</CardTitle>
                  <CardDescription>
                    {group.description || 'No description'}
                  </CardDescription>
                  <div className="flex items-center text-sm text-muted-foreground mt-2">
                    <Users className="h-4 w-4 mr-1" />
                    {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
