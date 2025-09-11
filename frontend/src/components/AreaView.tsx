import React from 'react';
import { useApp } from '../context/AppContext';
import ProjectView from './ProjectView';
import { Plus, Folder, Circle } from 'lucide-react';

interface AreaViewProps {
  areaId: string;
}

const AreaView: React.FC<AreaViewProps> = ({ areaId }) => {
  const { areas, projects, setSelectedProjectId } = useApp();
  
  const area = areas.find(a => a.id === areaId);
  const areaProjects = projects.filter(p => p.areaId === areaId);
  
  if (!area) {
    return <div className="p-4">Area not found</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Area Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <Circle className="w-8 h-8" style={{ color: area.color }} fill={area.color} />
          <h2 className="text-2xl font-bold text-gray-800">{area.name}</h2>
        </div>
        <p className="mt-2 text-gray-600">
          {areaProjects.length} {areaProjects.length === 1 ? 'project' : 'projects'} in this area
        </p>
      </div>

      {/* Projects Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {areaProjects.map(project => {
            const projectTasks = project.tasks || [];
            const completedTasks = projectTasks.filter(t => t.status === 'completed');
            const completionPercentage = projectTasks.length > 0
              ? Math.round((completedTasks.length / projectTasks.length) * 100)
              : 0;

            return (
              <button
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <Folder className="w-5 h-5 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {completedTasks.length}/{projectTasks.length}
                  </span>
                </div>
                
                <h3 className="font-semibold text-gray-800 mb-1">{project.name}</h3>
                
                {project.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {project.description}
                  </p>
                )}
                
                <div className="mt-3">
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 transition-all"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 mt-1">{completionPercentage}% complete</span>
                </div>
              </button>
            );
          })}
          
          {/* Add Project Card */}
          <button className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-100 transition-all flex flex-col items-center justify-center min-h-[150px]">
            <Plus className="w-6 h-6 text-gray-400 mb-2" />
            <span className="text-sm text-gray-600">New Project</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AreaView;