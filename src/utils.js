module.exports.pascalCase = (str) => {
  if (!str) return;
  const words = str.match(/[a-z]+/gi);
  return words
    .map(
      (word) => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase()
    )
    .join('');
};

module.exports.isOptional = (attributeValue) => {
  // arrays are never null
  if (attributeValue.relation === 'oneToMany' || attributeValue.repeatable) {
    return false;
  }
  return attributeValue.required !== true;
};
