export const SCRIPT_RUNNER_ID_ATTR = "data-script-runner-id";

function normalizePart(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\u0400-\u04FF_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildScriptRunnerBaseId({
  explicitId,
  label,
  fieldName,
  placeholder,
  autocompleteType,
}) {
  const explicit = normalizePart(explicitId);
  if (explicit) return explicit;

  const namedField = normalizePart(fieldName);
  if (namedField) return namedField;

  const labeledField = normalizePart(label);
  if (labeledField) return labeledField;

  const placeholderField = normalizePart(placeholder);
  if (placeholderField) return placeholderField;

  return autocompleteType ? `autocomplete-${normalizePart(autocompleteType)}` : "autocomplete";
}

export function buildAutocompleteOptionKey(option) {
  if (typeof option === "string") {
    return normalizePart(option) || "option";
  }
  if (!option || typeof option !== "object") {
    return "option";
  }

  const rawValue =
    option.id ??
    option.value ??
    option.key ??
    option.code ??
    option.label ??
    option.name ??
    option.title ??
    option.city ??
    option.requestNumber;

  return normalizePart(rawValue) || "option";
}

export function buildAutocompleteRunnerIds({
  explicitId,
  label,
  fieldName,
  placeholder,
  autocompleteType,
  option,
}) {
  const baseId = buildScriptRunnerBaseId({
    explicitId,
    label,
    fieldName,
    placeholder,
    autocompleteType,
  });

  return {
    baseId,
    rootId: `${baseId}-root`,
    inputId: `${baseId}-input`,
    paperId: `${baseId}-paper`,
    listboxId: `${baseId}-listbox`,
    optionId: option ? `${baseId}-option-${buildAutocompleteOptionKey(option)}` : null,
  };
}
