// Test rápido de la función deepMergeMarketing

function deepMergeMarketing(current, patch) {
  const result = { ...current };
  
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === undefined) {
      continue; // No sobrescribir con valores nulos
    }
    
    if (Array.isArray(value)) {
      result[key] = [...value]; // Reemplazar arrays completamente
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      result[key] = { ...(result[key] || {}), ...value }; // Merge objetos
    } else {
      result[key] = value; // Primitivos
    }
  }
  
  return result;
}

// Test 1: Marketing vacío + primera actualización
console.log('=== Test 1: Marketing vacío ===');
const current1 = {};
const patch1 = {
  card: {
    subtitle: 'Curso increíble',
    learnOutcomes: ['Outcome 1', 'Outcome 2']
  },
  hero: {
    previewUrl: 'https://example.com/video.mp4'
  }
};
const result1 = deepMergeMarketing(current1, patch1);
console.log('Resultado:', JSON.stringify(result1, null, 2));

// Test 2: Marketing existente + merge
console.log('\n=== Test 2: Marketing existente + merge ===');
const current2 = {
  card: {
    subtitle: 'Curso increíble',
    learnOutcomes: ['Outcome 1', 'Outcome 2']
  },
  hero: {
    previewUrl: 'https://example.com/video.mp4'
  }
};
const patch2 = {
  card: {
    coverImageUrl: 'https://example.com/cover.jpg',
    badges: ['Badge 1', 'Badge 2']
  },
  testimonials: [
    { quote: 'Excelente', studentName: 'Juan' }
  ]
};
const result2 = deepMergeMarketing(current2, patch2);
console.log('Resultado:', JSON.stringify(result2, null, 2));

console.log('\n=== Verificaciones ===');
console.log('Subtitle mantenido:', result2.card.subtitle ? '✅' : '❌');
console.log('Learn outcomes mantenidos:', result2.card.learnOutcomes ? '✅' : '❌');
console.log('Cover image añadido:', result2.card.coverImageUrl ? '✅' : '❌');
console.log('Preview URL mantenido:', result2.hero.previewUrl ? '✅' : '❌');
console.log('Testimonials añadidos:', result2.testimonials ? '✅' : '❌');
