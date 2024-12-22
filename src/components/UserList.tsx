import React from 'react';
import { Users, Video } from 'lucide-react';

interface UserInfo {
  username: string;
  socketId: string;
}

interface UserListProps {
  users: UserInfo[];
  currentUser: string;
  onCallUser: (username: string) => void;
}

export const UserList: React.FC<UserListProps> = ({ users, currentUser, onCallUser }) => {
  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-red-500" />
          <h2 className="font-medium">Utilisateurs ({users.length})</h2>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {users.map((user) => (
            <div
              key={`${user.username}-${user.socketId}`}
              className={`px-3 py-2 rounded-lg ${
                user.username === currentUser ? 'bg-red-500/10 text-red-400' : 'hover:bg-gray-700'
              } flex justify-between items-center`}
            >
              <span>
                {user.username} {user.username === currentUser && '(vous)'}
              </span>
              {user.username !== currentUser && (
                <button
                  onClick={() => onCallUser(user.username)}
                  className="p-1.5 hover:bg-gray-600 rounded-lg transition-colors flex items-center space-x-1"
                  title={`Appeler ${user.username}`}
                >
                  <Video className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">Appeler</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};