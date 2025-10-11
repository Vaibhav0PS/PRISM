import { useAuth } from '../context/AuthContext';

const UserRoleDebug = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg text-sm">
        🔒 Not logged in
      </div>
    );
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-600';
      case 'school_admin': return 'bg-blue-600';
      case 'donor': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return '👨‍💼';
      case 'school_admin': return '🏫';
      case 'donor': return '💝';
      default: return '👤';
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 ${getRoleColor(user.role)} text-white p-3 rounded-lg text-sm max-w-xs`}>
      <div className="font-medium">
        {getRoleIcon(user.role)} {user.name}
      </div>
      <div className="text-xs opacity-90 mt-1">
        Role: {user.role}
      </div>
      <div className="text-xs opacity-75">
        ID: {user.id.substring(0, 8)}...
      </div>
    </div>
  );
};

export default UserRoleDebug;