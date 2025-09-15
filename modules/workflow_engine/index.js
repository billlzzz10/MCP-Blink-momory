// modules/workflow_engine/index.js - A system for executing multi-step workflows.

import * as Api from '../../index.js';

/**
 * Resolves a value from the context using a path like 'steps.0.results.0.name'.
 * @param {string} path - The path to resolve.
 * @param {object} context - The context object containing workflow results.
 * @returns {*} The resolved value.
 */
function resolveContextPath(path, context) {
  return path.split('.').reduce((acc, part) => {
    if (acc === undefined) return undefined;
    // Handle array indices
    if (/^\d+$/.test(part)) {
      return acc[parseInt(part, 10)];
    }
    return acc[part];
  }, context);
}

/**
 * Parses parameters, resolving any context references.
 * @param {object} params - The parameters object for a workflow step.
 * @param {object} context - The context object containing workflow results.
 * @returns {object} The parameters with resolved values.
 */
function resolveParams(params, context) {
  const resolvedParams = {};
  for (const key in params) {
    const value = params[key];
    if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
      const path = value.substring(2, value.length - 2).trim();
      resolvedParams[key] = resolveContextPath(path, context);
    } else {
      resolvedParams[key] = value;
    }
  }
  return resolvedParams;
}

/**
 * Executes a workflow defined as an array of steps.
 * @param {object[]} workflow - The workflow to execute.
 * @returns {Promise<object>} A promise that resolves to the context containing all step results.
 */
export async function executeWorkflow(workflow) {
  const context = {
    steps: []
  };

  console.log(`🚀 Starting workflow with ${workflow.length} steps.`);

  for (let i = 0; i < workflow.length; i++) {
    const step = workflow[i];
    console.log(`▶️ Executing step ${i + 1}: ${step.action}`);

    try {
      const params = resolveParams(step.params || {}, context);
      let result;

      switch (step.action) {
        case 'semanticSearch':
          result = await Api.semanticSearch(params.query, params.options);
          break;
        case 'createEntity':
          result = await Api.createEntities([params.entity]);
          break;
        case 'createRelation':
          result = await Api.createRelations([params.relation]);
          break;
        case 'getLineage':
            result = await Api.MemoryGraph.getLineage(params.entityName, params.options);
            break;
        // Add other actions here as needed
        default:
          throw new Error(`Unknown action: ${step.action}`);
      }

      context.steps[i] = {
        action: step.action,
        status: 'success',
        results: result
      };
      console.log(`✅ Step ${i + 1} successful.`);

    } catch (error) {
      console.error(`❌ Error in step ${i + 1} (${step.action}):`, error);
      context.steps[i] = {
        action: step.action,
        status: 'error',
        error: error.message
      };
      // Stop workflow on error
      return context;
    }
  }

  console.log('🏁 Workflow finished successfully.');
  return context;
}
