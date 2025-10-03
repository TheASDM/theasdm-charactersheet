import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Reject any input that looks like SQL commands
// Basic heuristic to catch obvious SQL-injection attempts while avoiding normal text.
// Looks for SQL verbs followed by keywords that typically form part of a query.
const dangerousPatterns = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b[^;]*\b(FROM|INTO|TABLE|DATABASE)\b)/i;
const fieldsToSkipDeepScan = new Set([
  'characterData',
  'abilityScores',
  'features',
  'equipment',
  'spells',
  'classFeatures',
  'classFeatureData',
  'speciesTraits',
  'speciesSpells',
  'featFeatures',
  'featChoices',
]);

export const checkForSQLInjection = (req: Request, res: Response, next: NextFunction): void => {
  const checkValue = (key: string | null, val: unknown): boolean => {
    if (key && fieldsToSkipDeepScan.has(key)) {
      return false;
    }

    if (typeof val === 'string') {
      return dangerousPatterns.test(val);
    }

    if (Array.isArray(val)) {
      return val.some((item) => checkValue(key, item));
    }

    if (val && typeof val === 'object') {
      return Object.entries(val).some(([childKey, childVal]) =>
        checkValue(childKey, childVal)
      );
    }

    return false;
  };

  if (Object.entries(req.body).some(([key, value]) => checkValue(key, value))) {
    res.status(400).json({ error: 'Invalid input detected' });
    return;
  }

  next();
};

// Security sanitization (NOT business logic validation)
export const sanitizeCharacterInput = [
  // Prevent XSS in text fields - but don't require them
  body('name').optional().trim().escape().isLength({ max: 200 }),
  body('species').optional().trim().escape().isLength({ max: 100 }),
  body('class').optional().trim().escape().isLength({ max: 100 }),
  body('background').optional().trim().escape().isLength({ max: 100 }),
  body('alignment').optional().trim().escape().isLength({ max: 50 }),

  // Prevent unreasonably large numbers (but allow any value)
  body('level').optional().isInt({ min: -999, max: 999 }),
  body('experiencePoints').optional().isInt({ min: 0, max: 999999999 }),
  body('armorClass').optional().isInt({ min: -999, max: 999 }),
  body('speed').optional().isInt({ min: 0, max: 9999 }),
  body('maxHitPoints').optional().isInt({ min: 0, max: 99999 }),
  body('currentHitPoints').optional().isInt({ min: -99999, max: 99999 }),

  // Prevent huge JSON payloads that could crash the server
  body('abilityScores').optional().isObject(),
  body('features').optional().isArray({ max: 1000 }),
  body('equipment').optional().isArray({ max: 1000 }),
  body('spells').optional().isArray({ max: 1000 }),

  // Sanitize nested text fields if they exist
  body('*.name').optional().trim().escape().isLength({ max: 200 }),
  body('*.description').optional().trim().escape().isLength({ max: 10000 }),

  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Invalid input detected',
        details: errors.array(),
      });
      return;
    }
    next();
  },
];
