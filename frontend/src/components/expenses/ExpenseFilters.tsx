import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Member, ExpenseCategory } from '@/types';

interface ExpenseFiltersProps {
  searchQuery: string;
  filterMember: string;
  filterCategory: string;
  members: Member[];
  onSearchChange: (value: string) => void;
  onMemberFilterChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
}

export function ExpenseFilters({
  searchQuery,
  filterMember,
  filterCategory,
  members,
  onSearchChange,
  onMemberFilterChange,
  onCategoryFilterChange,
}: ExpenseFiltersProps) {
  return (
    <div className="mb-4 space-y-3">
      <Input
        placeholder="Search expenses..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">
            Filter by Member
          </Label>
          <Select value={filterMember} onValueChange={onMemberFilterChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">
            Filter by Category
          </Label>
          <Select value={filterCategory} onValueChange={onCategoryFilterChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value={ExpenseCategory.FOOD}>Food</SelectItem>
              <SelectItem value={ExpenseCategory.TRAVEL}>Travel</SelectItem>
              <SelectItem value={ExpenseCategory.UTILITIES}>Utilities</SelectItem>
              <SelectItem value={ExpenseCategory.ENTERTAINMENT}>Entertainment</SelectItem>
              <SelectItem value={ExpenseCategory.ACCOMMODATION}>Accommodation</SelectItem>
              <SelectItem value={ExpenseCategory.SHOPPING}>Shopping</SelectItem>
              <SelectItem value={ExpenseCategory.OTHER}>Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
