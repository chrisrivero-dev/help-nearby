import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

test('renders welcome message', () => {
  render(<Home />)
  expect(
    screen.getByRole('heading', { name: /welcome/i })
  ).toBeInTheDocument()
})
