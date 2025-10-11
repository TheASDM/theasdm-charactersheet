/**
 * Custom ESLint rules for D&D 2024 Character Sheet project
 *
 * These rules enforce proper parsing of D&D template tags throughout the codebase.
 */

module.exports = {
  'require-dnd-template-parsing': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Enforce parsing of D&D template tags when displaying database content',
        category: 'Best Practices',
        recommended: true,
      },
      messages: {
        missingParser: 'D&D content must be parsed through parseComplexDnDEntry() or parseDnDTemplateTag() to handle template tags like {@condition}, {@spell}, etc.',
        arrayNotParsed: 'Array containing D&D content (feature.entries, etc.) must be passed to parseComplexDnDEntry() as an array, NOT joined first',
        suspiciousDirectDisplay: 'Suspicious direct display of {{variable}} that may contain D&D template tags. Consider parsing with parseComplexDnDEntry()',
      },
      schema: [],
      fixable: 'code',
    },
    create(context) {
      const importedParsers = new Set();
      const suspiciousVariables = new Set();

      // Track variables that likely contain D&D content from the database
      const DND_CONTENT_SOURCES = [
        'feature', 'feat', 'spell', 'classFeature', 'backgroundFeature',
        'speciesFeature', 'entries', 'description', 'benefits', 'text'
      ];

      return {
        // Track if parsing functions are imported
        ImportDeclaration(node) {
          if (node.source.value === './utils/dndTemplateParser' ||
              node.source.value.includes('dndTemplateParser')) {
            node.specifiers.forEach(spec => {
              if (spec.imported && (
                spec.imported.name === 'parseComplexDnDEntry' ||
                spec.imported.name === 'parseDnDTemplateTag'
              )) {
                importedParsers.add(spec.local.name);
              }
            });
          }
        },

        // Check variable declarations for D&D content
        VariableDeclarator(node) {
          if (node.init && node.id.type === 'Identifier') {
            const varName = node.id.name.toLowerCase();

            // Check if variable name suggests D&D content
            if (DND_CONTENT_SOURCES.some(source => varName.includes(source))) {
              // Check if it's accessing properties that commonly have template tags
              if (node.init.type === 'MemberExpression') {
                const propName = node.init.property?.name?.toLowerCase() || '';
                if (['entries', 'description', 'text', 'benefits'].includes(propName)) {
                  suspiciousVariables.add(node.id.name);
                }
              }
            }
          }
        },

        // Check array.join() calls on D&D content
        CallExpression(node) {
          if (node.callee.type === 'MemberExpression' &&
              node.callee.property.name === 'join') {
            const objectName = getObjectName(node.callee.object);

            // Check if we're joining an entries array or similar
            if (objectName && (
              objectName.includes('entries') ||
              objectName.includes('feature') ||
              suspiciousVariables.has(objectName)
            )) {
              // Check if the result is being passed to a parser
              const parent = context.getAncestors().slice(-1)[0];
              const isBeingParsed = isPassedToParser(parent, importedParsers);

              if (!isBeingParsed) {
                context.report({
                  node,
                  messageId: 'arrayNotParsed',
                  fix(fixer) {
                    // Suggest wrapping in parseComplexDnDEntry
                    const parserName = Array.from(importedParsers)[0] || 'parseComplexDnDEntry';
                    return fixer.replaceText(
                      node,
                      `${parserName}(${context.getSourceCode().getText(node.callee.object)})`
                    );
                  }
                });
              }
            }
          }

          // Check direct string interpolation or display of D&D content
          if (node.callee.type === 'MemberExpression' &&
              (node.callee.property.name === 'map' ||
               node.callee.property.name === 'forEach')) {

            const objectName = getObjectName(node.callee.object);
            if (objectName && (
              objectName.includes('feature') ||
              objectName.includes('entries') ||
              objectName.includes('feat') ||
              suspiciousVariables.has(objectName)
            )) {
              // Check callback function
              const callback = node.arguments[0];
              if (callback && (callback.type === 'ArrowFunctionExpression' ||
                              callback.type === 'FunctionExpression')) {

                // Check if callback uses parser
                const callbackBody = callback.body;
                const bodyText = context.getSourceCode().getText(callbackBody);
                const usesParsing = Array.from(importedParsers).some(parser =>
                  bodyText.includes(parser)
                );

                // If it's a simple identity map or direct usage without parsing
                if (!usesParsing && callback.params.length > 0) {
                  const paramName = callback.params[0].name;

                  // Check if the param is used directly without parsing
                  if (callback.body.type === 'Identifier' &&
                      callback.body.name === paramName) {
                    context.report({
                      node: callback,
                      messageId: 'missingParser',
                    });
                  }
                }
              }
            }
          }
        },

        // Check JSX expressions for unparsed content
        JSXExpressionContainer(node) {
          if (node.expression.type === 'Identifier') {
            const varName = node.expression.name;

            if (suspiciousVariables.has(varName)) {
              context.report({
                node,
                messageId: 'suspiciousDirectDisplay',
                data: { variable: varName },
              });
            }
          }

          // Check for direct property access like {feature.description}
          if (node.expression.type === 'MemberExpression') {
            const propName = node.expression.property?.name?.toLowerCase() || '';
            const objName = getObjectName(node.expression.object)?.toLowerCase() || '';

            if (DND_CONTENT_SOURCES.some(source => objName.includes(source)) &&
                ['entries', 'description', 'text', 'benefits'].includes(propName)) {

              context.report({
                node,
                messageId: 'missingParser',
                fix(fixer) {
                  const parserName = Array.from(importedParsers)[0] || 'parseComplexDnDEntry';
                  return fixer.replaceText(
                    node.expression,
                    `${parserName}(${context.getSourceCode().getText(node.expression)})`
                  );
                }
              });
            }
          }
        },
      };
    },
  },
};

/**
 * Get the base object name from a member expression
 */
function getObjectName(node) {
  if (!node) return null;

  if (node.type === 'Identifier') {
    return node.name;
  }

  if (node.type === 'MemberExpression') {
    return getObjectName(node.object);
  }

  return null;
}

/**
 * Check if a value is being passed to a parser function
 */
function isPassedToParser(node, importedParsers) {
  if (!node) return false;

  if (node.type === 'CallExpression') {
    if (node.callee.type === 'Identifier' &&
        importedParsers.has(node.callee.name)) {
      return true;
    }
  }

  return false;
}
