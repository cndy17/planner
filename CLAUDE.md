# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack task management application with:
- **Backend**: Node.js/Express API with Prisma ORM and PostgreSQL database
- **Frontend**: React TypeScript application using Create React App

## Current Status
- ✅ Basic CRUD operations working
- ✅ Database schema with order fields for both tasks and projects
- ✅ Backend reorder endpoints implemented for tasks and projects
- ✅ Frontend state management with optimistic updates
- ✅ Enhanced UI components with modern styling and improved UX
- ✅ Project ordering functionality added
- ✅ TagFormModal component for tag management
- ✅ Drag-and-drop with dedicated handles implemented
- ✅ Multiple view layouts (Calendar, Planner, Projects, Areas)
- 🔄 **In progress**: Refining drag-and-drop user experience

## Drag-and-Drop Issue Analysis

### Current Implementation Problems
1. **Event Propagation Conflicts**: TaskCard has many interactive elements (buttons, checkboxes) that conflict with drag listeners
2. **Complex TaskCard Structure**: Hover states and action buttons interfere with dragging
3. **Missing Visual Cues**: No clear drag handle or indication items are draggable
4. **Touch Support Issues**: May not work well on mobile devices

### Recommended Solution: Dedicated Drag Handle Approach

**Based on analysis of major apps (Trello, Todoist, Linear, Notion):**

#### Implementation Plan:
1. **Add Dedicated Drag Handle** (5 min)
   ```tsx
   // In TaskCard.tsx
   import { GripVertical } from 'lucide-react';
   
   <div className="drag-handle opacity-0 group-hover:opacity-100 transition-opacity">
     <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />
   </div>
   ```

2. **Isolate Drag Listeners** (10 min)
   ```tsx
   // In TaskList.tsx - only attach listeners to handle
   <TaskCard 
     task={task} 
     dragHandleProps={attributes && listeners} // Pass to handle only
   />
   ```

3. **Prevent Event Conflicts** (5 min)
   ```tsx
   // Stop drag events from interfering with buttons
   <button onClick={handleEdit} onPointerDown={(e) => e.stopPropagation()}>
   ```

4. **Enhanced Visual Feedback** (10 min)
   ```tsx
   // Better drag overlay with rotation and shadow
   <DragOverlay>
     <div className="rotate-2 shadow-2xl border border-primary-200">
   ```

5. **Touch Support** (5 min)
   ```tsx
   useSensor(TouchSensor, {
     activationConstraint: { delay: 250, tolerance: 8 }
   })
   ```

### Why This Approach?
- ✅ Clear UX: Users know exactly where to drag
- ✅ No Conflicts: Buttons and checkboxes work normally  
- ✅ Mobile Friendly: Touch support with proper delays
- ✅ Professional: Matches industry patterns
- ✅ Minimal Changes: Builds on existing @dnd-kit setup

## Key Files
### Backend
- `/backend/index.js` - API endpoints with reorder functionality for both tasks and projects
- `/backend/prisma/schema.prisma` - Database schema with order fields for Projects and Tasks
- `/backend/fix-project-order.js` - Migration script for adding order to existing projects

### Frontend
- `/frontend/src/context/AppContext.tsx` - State management with optimistic updates
- `/frontend/src/components/AppLayout.tsx` - Main layout component with navigation
- `/frontend/src/components/TaskList.tsx` - @dnd-kit drag-and-drop implementation
- `/frontend/src/components/TaskCard.tsx` - Interactive task component with drag handles
- `/frontend/src/components/modals/TagFormModal.tsx` - Tag management modal
- `/frontend/src/components/AreaView.tsx` - Area-based project organization
- `/frontend/src/components/ProjectView.tsx` - Project detail view with task management
- `/frontend/src/index.css` - Global styles and modern UI theming

## Commands

### Backend Development
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Set up database (first time setup)
npx prisma migrate dev

# Generate Prisma client (after schema changes)
npx prisma generate

# Push schema changes without creating migration
npx prisma db push

# Start backend server (runs on port 4000)
node index.js

# Open Prisma Studio for database inspection
npx prisma studio
```

### Frontend Development
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server (runs on port 3000)
npm start

# Build for production
npm run build

# Run tests in watch mode
npm test

# Run tests once (CI mode)
CI=true npm test
```

## Architecture

### Database Schema
The application uses PostgreSQL with Prisma ORM. Core models with relationships:
- **Area**: Categories for organizing projects (has many Projects)
- **Project**: Contains multiple tasks, belongs to an Area (optional)
- **Task**: Core entity with hierarchical structure (subtasks via self-relation), can belong to a Project, supports tags, recurrence, and various date/time fields
- **Tag**: Many-to-many relationship with Tasks through "TaskTags" relation

### Backend API
Express server (`backend/index.js`) exposing RESTful endpoints:

#### Core CRUD Operations
- `GET /areas` - Returns areas with their projects
- `GET /projects` - Returns projects with tasks and area
- `GET /tasks` - Returns tasks with tags and project
- `GET /tags` - Returns tags with associated tasks
- `POST /areas` - Create new area
- `POST /projects` - Create new project
- `POST /tasks` - Create new task
- `POST /tags` - Create new tag
- `PUT /areas/:id` - Update area
- `PUT /projects/:id` - Update project  
- `PUT /tasks/:id` - Update task
- `PUT /tags/:id` - Update tag
- `DELETE /areas/:id` - Delete area
- `DELETE /projects/:id` - Delete project
- `DELETE /tasks/:id` - Delete task
- `DELETE /tags/:id` - Delete tag

#### Reordering Operations
- `PUT /tasks/reorder` - Reorder tasks within a project or section
- `PUT /projects/reorder` - Reorder projects within an area

Configuration:
- Database connection via `DATABASE_URL` environment variable
- Default port: 4000 (configurable via `PORT` env var)
- CORS enabled for cross-origin requests

### Frontend Structure
TypeScript React application with:
- Strict TypeScript compilation (`strict: true`)
- React 19 with latest testing libraries
- Create React App configuration (not ejected)
- Test files colocated with components (`*.test.tsx`)
- @dnd-kit for drag-and-drop functionality
- Lucide React for icons
- Modern CSS with CSS variables for theming

## Recent Enhancements (Latest)

### Database & Backend (Commit: a85dfcd)
- ✅ Added `order` field to Projects table with migration
- ✅ Created data migration script (`fix-project-order.js`) for existing projects
- ✅ Implemented project reordering API endpoint (`PUT /projects/reorder`)
- ✅ Enhanced existing task reordering functionality

### Frontend & UI (Commit: e7cd50a)
- ✅ **Major UI Overhaul**: Updated 17 components with modern styling
- ✅ **New TagFormModal**: Complete tag management interface
- ✅ **Enhanced Drag-and-Drop**: Dedicated drag handles with visual feedback
- ✅ **Improved Components**: AppLayout, TaskCard, TaskList, ProjectView, AreaView
- ✅ **Modern Styling**: Updated CSS with better colors, spacing, and interactions
- ✅ **Type Safety**: Enhanced TypeScript definitions

### Key Features Added
- 🎯 **Project Reordering**: Drag and drop projects within areas
- 🏷️ **Tag Management**: Modal interface for creating/editing tags
- 📱 **Responsive Design**: Better mobile and desktop experience  
- 🎨 **Visual Polish**: Consistent spacing, colors, and hover effects
- ⚡ **Performance**: Optimized state management and rendering