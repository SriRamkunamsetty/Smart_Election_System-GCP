import '@testing-library/jest-dom';

// Mock scrollTo in jsdom
Element.prototype.scrollTo = () => {};
window.scrollTo = () => {};
