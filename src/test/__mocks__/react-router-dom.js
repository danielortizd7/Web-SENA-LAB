const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  createHref: jest.fn(),
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'default',
};

export const MemoryRouter = ({ children }) => children;
export const useNavigate = () => mockRouter.push;
export const useLocation = () => ({
  pathname: mockRouter.pathname,
  search: mockRouter.search,
  hash: mockRouter.hash,
  state: mockRouter.state,
  key: mockRouter.key,
});
