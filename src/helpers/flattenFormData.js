export default function flattenFormData(input) {
    const result = {};
    for (const key in input) {
        if (typeof input[key] === 'object' && input[key] !== null && 'ID' in input[key]) {
            result[key] = input[key].ID;
        } else {
            result[key] = input[key];
        }
    }
    return result;
}