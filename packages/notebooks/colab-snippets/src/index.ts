/**
 * Colab Snippets - Utility functions for Jupyter notebook operations
 * @packageDocumentation
 */

export interface NotebookCell {
  cell_type: 'code' | 'markdown';
  source: string[];
  metadata?: Record<string, unknown>;
  outputs?: unknown[];
  execution_count?: number | null;
}

export interface NotebookDocument {
  cells: NotebookCell[];
  metadata: {
    kernelspec?: {
      display_name: string;
      name: string;
    };
    language_info?: {
      name: string;
      version?: string;
    };
  };
  nbformat: number;
  nbformat_minor: number;
}

/**
 * Parse a Jupyter notebook from JSON
 */
export function parseNotebook(json: string): NotebookDocument {
  try {
    const parsed = JSON.parse(json);
    if (!parsed.cells || !Array.isArray(parsed.cells)) {
      throw new Error('Invalid notebook format: missing cells array');
    }
    return parsed as NotebookDocument;
  } catch (error) {
    throw new Error(`Failed to parse notebook: ${error}`);
  }
}

/**
 * Extract code cells from a notebook
 */
export function extractCodeCells(notebook: NotebookDocument): NotebookCell[] {
  return notebook.cells.filter(cell => cell.cell_type === 'code');
}

/**
 * Extract markdown cells from a notebook
 */
export function extractMarkdownCells(notebook: NotebookDocument): NotebookCell[] {
  return notebook.cells.filter(cell => cell.cell_type === 'markdown');
}

/**
 * Get library imports from code cells
 */
export function extractImports(notebook: NotebookDocument): string[] {
  const codeCells = extractCodeCells(notebook);
  const imports: string[] = [];
  
  codeCells.forEach(cell => {
    cell.source.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
        imports.push(trimmed);
      }
    });
  });
  
  return imports;
}

/**
 * Generate a summary of notebook contents
 */
export function generateNotebookSummary(notebook: NotebookDocument): {
  totalCells: number;
  codeCells: number;
  markdownCells: number;
  imports: string[];
  language: string;
} {
  const codeCells = extractCodeCells(notebook);
  const markdownCells = extractMarkdownCells(notebook);
  const imports = extractImports(notebook);
  
  return {
    totalCells: notebook.cells.length,
    codeCells: codeCells.length,
    markdownCells: markdownCells.length,
    imports,
    language: notebook.metadata.language_info?.name || 'unknown'
  };
}