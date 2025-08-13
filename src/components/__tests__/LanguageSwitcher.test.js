import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import LanguageSwitcher from '../LanguageSwitcher'

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: jest.fn(),
      language: 'en',
    },
  }),
}))

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders current language button', () => {
    render(<LanguageSwitcher />)
    expect(screen.getByRole('button', { name: /english/i })).toBeInTheDocument()
  })

  test('shows language options when clicked', async () => {
    render(<LanguageSwitcher />)
    const toggle = screen.getByRole('button', { name: /english/i })
    fireEvent.click(toggle)
    await waitFor(() => {
      const allEnglish = screen.getAllByText('English')
      expect(allEnglish.length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Español')).toBeInTheDocument()
    })
  })

  test('changes language when option is selected', async () => {
    const mockChangeLanguage = jest.fn()
    jest.spyOn(require('react-i18next'), 'useTranslation').mockReturnValue({
      t: (key) => key,
      i18n: {
        changeLanguage: mockChangeLanguage,
        language: 'en',
      },
    })

    render(<LanguageSwitcher />)
    const toggle = screen.getByRole('button', { name: /english/i })
    fireEvent.click(toggle)
    const option = await screen.findByRole('button', { name: /español/i })
    fireEvent.click(option)

    await waitFor(() => {
      expect(mockChangeLanguage).toHaveBeenCalledWith('es')
    })
  })

  test('has correct styling classes on toggle button', () => {
    render(<LanguageSwitcher />)
    const toggle = screen.getByRole('button', { name: /english/i })
    expect(toggle).toHaveClass('bg-white', 'border', 'border-gray-300', 'rounded-md')
  })

  test('is accessible with proper roles', () => {
    render(<LanguageSwitcher />)
    expect(screen.getByRole('button', { name: /english/i })).toBeInTheDocument()
  })
})
