describe('Collaborative Whiteboard E2E Tests', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'TestPassword123',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User'
  };

  beforeEach(() => {
    cy.visit('/');
  });

  it('should load the login page', () => {
    cy.contains('Login to Collaborative Whiteboard');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
  });

  it('should allow user to register', () => {
    cy.visit('/register');
    cy.get('#username').type(testUser.username);
    cy.get('#email').type(testUser.email);
    cy.get('#password').type(testUser.password);
    cy.get('#firstName').type(testUser.firstName);
    cy.get('#lastName').type(testUser.lastName);
    cy.get('button[type="submit"]').click();

    // Should redirect to boards page after registration
    cy.url().should('include', '/boards');
  });

  it('should allow user to login', () => {
    cy.visit('/login');
    cy.get('#email').type(testUser.email);
    cy.get('#password').type(testUser.password);
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/boards');
  });

  it('should create a new board', () => {
    // Login first
    cy.visit('/login');
    cy.get('#email').type(testUser.email);
    cy.get('#password').type(testUser.password);
    cy.get('button[type="submit"]').click();

    // Create new board
    cy.contains('+ New Board').click();
    cy.get('#boardName').type('Test Board');
    cy.get('#boardDescription').type('This is a test board');
    cy.contains('Create Board').click();

    // Should navigate to whiteboard
    cy.url().should('include', '/whiteboard/');
  });

  it('should draw shapes on canvas', () => {
    // Assuming user is logged in and on a board
    cy.visit('/login');
    cy.get('#email').type(testUser.email);
    cy.get('#password').type(testUser.password);
    cy.get('button[type="submit"]').click();

    // Create and open board
    cy.contains('+ New Board').click();
    cy.get('#boardName').type('Drawing Test');
    cy.contains('Create Board').click();

    // Select rectangle tool
    cy.contains('Rectangle').click();

    // Draw rectangle on canvas
    cy.get('canvas').trigger('mousedown', { clientX: 100, clientY: 100 });
    cy.get('canvas').trigger('mousemove', { clientX: 200, clientY: 200 });
    cy.get('canvas').trigger('mouseup');

    // Verify element was created (check element count)
    cy.contains('1 elements');
  });

  it('should support zoom controls', () => {
    // Navigate to board
    cy.visit('/login');
    cy.get('#email').type(testUser.email);
    cy.get('#password').type(testUser.password);
    cy.get('button[type="submit"]').click();

    // Test zoom in
    cy.contains('+').click();
    cy.contains('120%');

    // Test zoom out
    cy.contains('-').click();
    cy.contains('100%');

    // Test reset
    cy.contains('Reset').click();
    cy.contains('100%');
  });

  it('should support keyboard shortcuts', () => {
    // Navigate to board
    cy.visit('/login');
    cy.get('#email').type(testUser.email);
    cy.get('#password').type(testUser.password);
    cy.get('button[type="submit"]').click();

    // Test undo shortcut (Ctrl+Z)
    cy.get('body').type('{ctrl}z');

    // Test zoom in (Ctrl++)
    cy.get('body').type('{ctrl}+');
    cy.contains(/[0-9]+%/);
  });
});
