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

  test('renders language switcher with current language', () => {
    render(<LanguageSwitcher />)
    
    expect(screen.getByText('Language')).toBeInTheDocument()
    expect(screen.getByDisplayValue('English')).toBeInTheDocument()
  })

  test('shows language options when clicked', async () => {
    render(<LanguageSwitcher />)
    
    const select = screen.getByRole('combobox')
    fireEvent.click(select)
    
    await waitFor(() => {
      expect(screen.getByText('English')).toBeInTheDocument()
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
    
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'es' } })
    
    await waitFor(() => {
      expect(mockChangeLanguage).toHaveBeenCalledWith('es')
    })
  })

  test('has correct styling classes', () => {
    render(<LanguageSwitcher />)
    
    const select = screen.getByRole('combobox')
    expect(select).toHaveClass('bg-white', 'border', 'border-gray-300', 'rounded-md')
  })

  test('is accessible with proper labels', () => {
    render(<LanguageSwitcher />)
    
    const select = screen.getByRole('combobox')
    expect(select).toHaveAttribute('aria-label', 'Select language')
  })
})
