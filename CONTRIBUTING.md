# Contributing Guidelines

Thank you for your interest in contributing to the Explicit Agent Protocol + Knowledge Graph Memory project! 🎉

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)
- [Code of Conduct](#code-of-conduct)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ LTS
- npm or yarn
- Git
- VS Code (recommended)

### Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/knowledge-graph-memory.git
   cd knowledge-graph-memory
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Verify setup**
   ```bash
   npm run validate
   npm run test:bootstrap
   ```

4. **Create your feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 🔄 Development Workflow

### 1. Branch Strategy

- `main` - Production-ready code (beta releases)
- `develop` - Development branch for ongoing work
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Emergency fixes

### 2. Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the [Code Style](#code-style) guidelines
   - Write tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm test
   npm run test:coverage
   npm run validate
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

### 3. Commit Message Format

Use [Conventional Commits](https://conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes
- `refactor` - Code refactoring
- `test` - Test changes
- `chore` - Build process or auxiliary tool changes

**Examples:**
```
feat(memory_graph): add entity search by tags
fix(embedding_service): resolve cache memory leak
docs(api): update parameter descriptions
test(memory_graph): add edge case tests
```

## 💻 Code Style

### JavaScript/TypeScript

- Use ES6 modules (`import`/`export`)
- Use `const` and `let` instead of `var`
- Use arrow functions for callbacks
- Use async/await for asynchronous code
- Use JSDoc for all public functions
- Follow the existing code style and patterns

### File Structure

- Keep files under 500 lines when possible
- Use meaningful file and function names
- Separate concerns into different modules
- Use consistent naming conventions

### Error Handling

- Use custom `KGMemoryError` class for errors
- Provide meaningful error messages
- Handle async operations with try/catch
- Log errors with context information

### Example

```javascript
/**
 * Creates entities with auto-tagging
 * @param {Array} entities - Array of entity objects
 * @returns {Promise} Promise with creation results
 */
async function createEntities(entities) {
  try {
    // Input validation
    if (!Array.isArray(entities)) {
      throw new KGMemoryError('ENTITIES_ARRAY_REQUIRED', 'Entities must be an array');
    }

    // Process entities
    const results = await Promise.all(
      entities.map(entity => processEntity(entity))
    );

    // Log lineage
    Lineage.log('createEntities', { count: entities.length });

    return results;
  } catch (error) {
    // Log error with context
    console.error('❌ Failed to create entities:', error.message);
    throw error; // Re-throw for caller handling
  }
}
```

## 🧪 Testing

### Test Structure

- **Unit Tests**: Test individual functions and modules
- **Integration Tests**: Test module interactions
- **Performance Tests**: Test performance benchmarks
- **Manual Tests**: Test user workflows

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- memory_graph

# Run tests in watch mode
npm run test:watch
```

### Writing Tests

Use the existing test patterns:

```javascript
const { KGMemory } = require('../index.js');

describe('KGMemory', () => {
  let kg;

  beforeEach(() => {
    kg = new KGMemory();
  });

  describe('createEntities', () => {
    it('should create entities successfully', async () => {
      const entities = [
        {
          name: 'test-entity',
          entityType: 'test',
          observations: [{ content: 'Test observation' }]
        }
      ];

      const result = await kg.createEntities(entities);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBeDefined();
      expect(result[0].name).toBe('test-entity');
    });

    it('should validate input parameters', async () => {
      await expect(kg.createEntities(null)).rejects.toThrow();
      await expect(kg.createEntities('invalid')).rejects.toThrow();
    });
  });
});
```

### Test Coverage

- Maintain 80%+ test coverage for core modules
- Test both success and error scenarios
- Test edge cases and boundary conditions
- Mock external dependencies when necessary

## 📚 Documentation

### Documentation Types

1. **Code Documentation**: JSDoc for all public functions
2. **API Documentation**: Complete API reference in `docs/api.md`
3. **Architecture Documentation**: System design in `docs/architecture.md`
4. **Setup Documentation**: Installation guides in `docs/setup.md`
5. **README.md**: Project overview and quick start

### Updating Documentation

When adding new features:

1. Update JSDoc comments
2. Add API documentation
3. Update README.md with usage examples
4. Add architecture diagrams if needed
5. Update setup instructions for new dependencies

### Documentation Standards

- Use clear, concise language
- Provide code examples
- Document error conditions
- Include performance characteristics
- Document security considerations

## 🔄 Pull Request Process

### 1. Preparation

Before creating a PR:

1. **Update your fork**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run final validation**
   ```bash
   npm run validate
   npm test
   npm run test:coverage
   ```

3. **Check checklist**
   - Review `docs/checklist.md`
   - Ensure all requirements are met
   - Update documentation if needed

### 2. Creating the PR

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create PR from GitHub**
   - Use the PR template
   - Fill in all required fields
   - Link related issues
   - Provide detailed description

3. **PR Description Template**

```markdown
## 📋 PR Information

**PR Title:** [Type] Description of changes

**Branch:** `main` ← `feature/your-feature-name`

**Type:** 
- [x] ✨ New Feature
- [ ] 🐛 Bug Fix
- [ ] 📚 Documentation

## 📝 Summary

Brief description of changes made.

## 🎯 Changes Made

- Feature 1
- Feature 2
- Bug fix 1

## 🧪 Testing

- [x] Unit tests pass
- [x] Integration tests pass
- [x] Manual verification completed

## 📋 Checklist

- [x] Code follows style guidelines
- [x] Tests added/updated
- [x] Documentation updated
- [x] No breaking changes
```

### 3. PR Review Process

1. **Automated Checks**
   - CI/CD pipeline validation
   - Code quality checks
   - Security scans
   - Test coverage verification

2. **Manual Review**
   - Code review by maintainers
   - Testing verification
   - Documentation review
   - Performance evaluation

3. **Feedback and Changes**
   - Address review comments
   - Make necessary changes
   - Update PR description
   - Request re-review if needed

### 4. Merging

PRs will be merged when:
- All automated checks pass
- Manual review is approved
- No breaking changes (unless documented)
- Documentation is updated
- Tests are comprehensive

## 🐛 Reporting Issues

### Bug Reports

When reporting bugs, please include:

1. **Environment**
   - Node.js version
   - Operating system
   - Package versions

2. **Steps to Reproduce**
   ```javascript
   // Minimal code example
   const { KGMemory } = require('./index.js');
   const kg = new KGMemory();
   
   // Code that causes the issue
   ```

3. **Expected Behavior**
   What should happen

4. **Actual Behavior**
   What actually happens

5. **Error Messages**
   Full error stack trace

### Feature Requests

For feature requests, include:

1. **Problem Statement**
   What problem are you trying to solve?

2. **Proposed Solution**
   How would you like this feature to work?

3. **Use Cases**
   How will this feature be used?

4. **Alternatives Considered**
   Any other approaches you've considered

## 🤝 Code of Conduct

### Our Pledge

We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for everyone, regardless of age, body size, visible or invisible disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contributes to a positive environment for our community:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported to the maintainers. All complaints will be reviewed and investigated promptly and fairly.

## 📞 Contact

- **Project Lead**: [@maintainer](https://github.com/maintainer)
- **GitHub Issues**: [Create an issue](https://github.com/knowledge-graph-memory/knowledge-graph-memory/issues)
- **Discussions**: [GitHub Discussions](https://github.com/knowledge-graph-memory/knowledge-graph-memory/discussions)

## 📄 License

By contributing, you agree that your contributions will be licensed under the project's license.

---

**Happy coding! 🎉**