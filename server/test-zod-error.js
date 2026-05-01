const { z } = require('zod');

const schema = z.object({
    name: z.string()
});

try {
    schema.parse({ name: 123 });
} catch (error) {
    if (error instanceof z.ZodError) {
        console.log('Is ZodError');
        console.log('error.errors:', error.errors);
        console.log('error.issues:', error.issues);
    } else {
        console.log('Not ZodError');
    }
}
