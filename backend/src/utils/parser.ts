import { ComponentProp } from './db.js';

/**
 * Parses React component code (TSX/JSX) to automatically extract properties,
 * types, default values, and description JSDoc comments.
 */
export function parsePropsFromCode(code: string): ComponentProp[] {
  const propsMap = new Map<string, Partial<ComponentProp>>();

  // 1. Parse TypeScript Interface or Type Definitions
  // Match interface NameProps { ... } or type NameProps = { ... }
  const interfaceRegex = /(?:interface|type)\s+(\w*(?:Props|Props))\s*(?:=)?\s*\{([\s\S]*?)\}/g;
  let match;

  while ((match = interfaceRegex.exec(code)) !== null) {
    const blockContent = match[2];
    
    // Regex to match individual properties along with their preceding JSDoc comments
    // Example matches:
    // /** Description here */
    // propName?: type;
    const propDeclarationRegex = /(?:\/\*\*([\s\S]*?)\*\/)?\s*(\w+)(\?)?\s*:\s*([^;\n]+)/g;
    let propMatch;
    
    while ((propMatch = propDeclarationRegex.exec(blockContent)) !== null) {
      const docComment = propMatch[1] ? propMatch[1].replace(/\*\/|^\s*\* ?/gm, '').trim() : undefined;
      const propName = propMatch[2].trim();
      const isOptional = !!propMatch[3];
      const propType = propMatch[4].trim().replace(/[,;]$/, '');

      propsMap.set(propName, {
        name: propName,
        type: propType,
        required: !isOptional,
        description: docComment || '',
        defaultValue: undefined
      });
    }
  }

  // 2. Parse Parameter Destructuring to Extract Default Values
  // Match arrow functions or standard functions with destructured object parameters
  // e.g., ({ label, disabled = false, variant = 'primary' }) =>
  // or function Button({ label, disabled = false })
  const destructureRegex = /(?:const\s+\w+\s*=\s*(?:async\s*)?\(\{\s*([\s\S]*?)\s*\}\s*|function\s+\w+\s*\(\{\s*([\s\S]*?)\s*\}\s*)/g;
  let destMatch;
  
  while ((destMatch = destructureRegex.exec(code)) !== null) {
    const paramsContent = destMatch[1] || destMatch[2];
    if (!paramsContent) continue;

    // Split parameters by comma, taking care not to split inside nested objects/arrays if possible
    // (A simple split by comma is usually sufficient for simple destructured React parameters)
    const params = paramsContent.split(',');
    
    for (const param of params) {
      const cleanParam = param.trim();
      if (!cleanParam) continue;

      // Match name = defaultValue
      const parts = cleanParam.split('=');
      const paramName = parts[0].trim();
      
      // If there is an alias or type annotation in the destructure, clean it
      // e.g. label: customLabel or label?: type (rare in destructuring but possible)
      const cleanParamName = paramName.split(':')[0].trim();

      if (parts.length > 1) {
        const defaultVal = parts[1].trim();
        // Remove trailing comments or type assertions if any
        const cleanDefaultVal = defaultVal.split('//')[0].split('/*')[0].trim();
        
        const existing = propsMap.get(cleanParamName);
        if (existing) {
          existing.defaultValue = cleanDefaultVal;
        } else {
          propsMap.set(cleanParamName, {
            name: cleanParamName,
            type: 'any',
            required: false,
            defaultValue: cleanDefaultVal,
            description: ''
          });
        }
      } else if (cleanParamName && !propsMap.has(cleanParamName) && !cleanParamName.startsWith('...')) {
        // Parameter exists but wasn't in interface/type definitions
        propsMap.set(cleanParamName, {
          name: cleanParamName,
          type: 'any',
          required: true,
          description: '',
          defaultValue: undefined
        });
      }
    }
  }

  // 3. Fallback: Parse simple defaultProps if defined on the component
  // e.g., Button.defaultProps = { disabled: false };
  const defaultPropsRegex = /(\w+)\.defaultProps\s*=\s*\{([\s\S]*?)\}/g;
  let dpMatch;
  while ((dpMatch = defaultPropsRegex.exec(code)) !== null) {
    const block = dpMatch[2];
    const pairs = block.split(',');
    for (const pair of pairs) {
      const parts = pair.split(':');
      if (parts.length < 2) continue;
      const propName = parts[0].trim().replace(/['"]/g, '');
      const defaultVal = parts[1].trim().replace(/[,;]$/, '');
      
      const existing = propsMap.get(propName);
      if (existing) {
        existing.defaultValue = defaultVal;
      }
    }
  }

  // Convert the map to an array of complete ComponentProp objects
  const result: ComponentProp[] = [];
  for (const [_, prop] of propsMap) {
    result.push({
      name: prop.name || '',
      type: prop.type || 'any',
      required: prop.required !== undefined ? prop.required : false,
      defaultValue: prop.defaultValue,
      description: prop.description || ''
    });
  }

  // Filter out any empty names or React specific props like 'ref'
  return result.filter(p => p.name && p.name !== 'children' && p.name !== 'className');
}
