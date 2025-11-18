import { GlobalStatusControl } from '@/components/admin/GlobalStatusControl';

const AdminSystemStatus = () => {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">System Status</h1>
        <p className="text-muted-foreground mt-2">
          Manage the global status banner that appears to all students
        </p>
      </div>
      
      <GlobalStatusControl />
    </div>
  );
};

export default AdminSystemStatus;
