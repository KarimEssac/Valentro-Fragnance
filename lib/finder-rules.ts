export const FINDER_RULE_PREFIX = "finder-rule:";

export const avoidanceVerbs = [
  "DISLIKES",
  "IS_SENSITIVE_TO",
  "WANTS_TO_AVOID"
] as const;

export type FinderRuleVerb = (typeof avoidanceVerbs)[number];

export type FinderRule = {
  verb: FinderRuleVerb;
  ingredient: string;
};

const allVerbs = new Set<FinderRuleVerb>(avoidanceVerbs);

export function encodeFinderRule({verb, ingredient}: FinderRule) {
  return `${FINDER_RULE_PREFIX}${verb}:${encodeURIComponent(ingredient.trim())}`;
}

export function parseFinderRule(value: string): FinderRule | null {
  if (!value.startsWith(FINDER_RULE_PREFIX)) return null;

  const separator = value.indexOf(":", FINDER_RULE_PREFIX.length);
  if (separator === -1) return null;

  const verb = value.slice(FINDER_RULE_PREFIX.length, separator) as FinderRuleVerb;
  if (!allVerbs.has(verb)) return null;

  try {
    const ingredient = decodeURIComponent(value.slice(separator + 1))
      .trim()
      .replace(/\s+/g, " ");
    return ingredient && ingredient.length <= 120 ? {verb, ingredient} : null;
  } catch {
    return null;
  }
}

export function finderRuleLabel(rule: FinderRule) {
  const verbLabels: Record<FinderRuleVerb, string> = {
    DISLIKES: "dislikes",
    IS_SENSITIVE_TO: "is sensitive to",
    WANTS_TO_AVOID: "wants to avoid"
  };

  return `Customer ${verbLabels[rule.verb]} ${rule.ingredient}`;
}
