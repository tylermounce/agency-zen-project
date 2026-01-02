// Form validation utilities

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface TaskValidation {
  title: string;
  assignee_id: string;
  due_date: string;
  description?: string;
}

export interface ProjectValidation {
  title: string;
  workspace_id: string;
}

export interface WorkspaceValidation {
  name: string;
}

// Validate task form
export const validateTask = (data: TaskValidation): ValidationResult => {
  const errors: Record<string, string> = {};

  // Title validation
  if (!data.title || !data.title.trim()) {
    errors.title = 'Task title is required';
  } else if (data.title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters';
  } else if (data.title.trim().length > 200) {
    errors.title = 'Title must be less than 200 characters';
  }

  // Assignee validation
  if (!data.assignee_id) {
    errors.assignee_id = 'Please select an assignee';
  }

  // Due date validation
  if (!data.due_date) {
    errors.due_date = 'Due date is required';
  } else {
    const dueDate = new Date(data.due_date);
    if (isNaN(dueDate.getTime())) {
      errors.due_date = 'Invalid date format';
    }
  }

  // Description validation (optional but limited)
  if (data.description && data.description.length > 5000) {
    errors.description = 'Description must be less than 5000 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validate project form
export const validateProject = (data: ProjectValidation): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.title || !data.title.trim()) {
    errors.title = 'Project title is required';
  } else if (data.title.trim().length < 2) {
    errors.title = 'Title must be at least 2 characters';
  } else if (data.title.trim().length > 100) {
    errors.title = 'Title must be less than 100 characters';
  }

  if (!data.workspace_id) {
    errors.workspace_id = 'Workspace is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validate workspace form
export const validateWorkspace = (data: WorkspaceValidation): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.name || !data.name.trim()) {
    errors.name = 'Workspace name is required';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  } else if (data.name.trim().length > 50) {
    errors.name = 'Name must be less than 50 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Sanitize text input (basic XSS prevention)
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();
};
