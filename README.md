# Task Management Planner

A full-stack task management application with advanced project organization, kanban-style planning, and comprehensive task categorization.

## Features

### 📋 Task Management
- **Task Types**: Regular tasks, updates, actions, and next steps
- **Smart Status Updates**: Projects automatically update to "In Progress" when tasks are completed
- **Hierarchical Organization**: Areas → Projects → Tasks with drag-and-drop reordering
- **Rich Task Details**: Due dates, planned dates, priorities, tags, and notes

### 📅 Planning Views
- **Daily Planner**: Kanban-style view with 6-day layout (1 day before + today + 4 days after)
- **Calendar View**: Full calendar integration for task scheduling
- **Project Dashboard**: Comprehensive overview with statistics and quick actions
- **Area Overview**: Project organization with task type filtering

### 🎯 Smart Features
- **Auto Status Updates**: Project status changes based on task completion
- **Drag & Drop**: Intuitive task and project reordering
- **Quick Entry**: Fast task creation with type selection
- **Advanced Filtering**: Filter by task type, area, project, and status
- **Search**: Global search across all tasks and projects

## Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **Prisma ORM** for database management
- **RESTful API** with CORS support

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **@dnd-kit** for drag-and-drop functionality
- **Lucide React** for icons
- **date-fns** for date manipulation

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/cndy17/planner.git
   cd planner
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install

   # Set up environment variables
   cp .env.example .env
   # Edit .env with your database connection string

   # Run database migrations
   npx prisma migrate dev

   # Start the backend server
   npm start
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install

   # Start the development server
   npm start
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

## Database Schema

### Core Models
- **Area**: Top-level organization (e.g., "Work", "Personal")
- **Project**: Contains tasks and belongs to an area
- **Task**: Core entity with type, status, dates, and relationships
- **Tag**: Many-to-many relationship with tasks
- **TaskSection**: Optional grouping within projects

### Task Types
- **task**: Regular tasks and to-dos
- **update**: Status updates and progress reports
- **action**: Action items requiring immediate attention
- **next-step**: Follow-up tasks and next steps

## API Endpoints

### Areas
- `GET /areas` - List all areas with projects
- `POST /areas` - Create new area
- `PUT /areas/:id` - Update area
- `DELETE /areas/:id` - Delete area
- `PUT /areas/reorder` - Reorder areas

### Projects
- `GET /projects` - List all projects with tasks
- `POST /projects` - Create new project
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project
- `PUT /projects/reorder` - Reorder projects

### Tasks
- `GET /tasks` - List all tasks with tags and projects
- `POST /tasks` - Create new task
- `PUT /tasks/:id` - Update task (auto-updates project status)
- `DELETE /tasks/:id` - Delete task
- `PUT /tasks/reorder` - Reorder tasks

### Tags
- `GET /tags` - List all tags
- `POST /tags` - Create new tag
- `PUT /tags/:id` - Update tag
- `DELETE /tags/:id` - Delete tag

## Key Features

### Auto Project Status Updates
Projects automatically update their status from "Not Started" to "In Progress" when any task is completed, providing better project lifecycle tracking.

### Responsive Planner Layout
The daily planner features a fixed header with scrollable day columns, showing a focused 6-day view for better task planning and scheduling.

### Task Type System
Four distinct task types enable better categorization and workflow management:
- Regular tasks for standard to-dos
- Updates for progress reporting
- Actions for urgent items
- Next steps for follow-up work

### Drag & Drop Interface
Intuitive drag-and-drop functionality for:
- Reordering tasks within projects
- Moving tasks between dates in the planner
- Organizing projects within areas

## Development

### Backend Commands
```bash
# Navigate to backend
cd backend

# Database operations
npx prisma migrate dev    # Run migrations
npx prisma generate      # Generate Prisma client
npx prisma studio        # Open database browser

# Start server
node index.js
```

### Frontend Commands
```bash
# Navigate to frontend
cd frontend

# Development
npm start               # Start dev server
npm run build          # Build for production
npm test               # Run tests
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with modern React and Node.js technologies
- UI components styled with Tailwind CSS
- Icons provided by Lucide React
- Drag & drop functionality powered by @dnd-kit