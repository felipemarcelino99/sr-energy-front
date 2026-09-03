import { useEffect } from 'react'
import { usePageHeaderStore } from '@/viewmodels/pageHeader.viewmodel'

interface UsePageHeaderOptions {
  subtitle?: string
  onBack?: () => void
}

/**
 * Publica o título/subtítulo/botão-voltar da página atual no navbar
 * (ver `Navbar.tsx`). Como só uma página fica montada por vez (React
 * Router), o cleanup no unmount garante que o navbar nunca mostra o título
 * de uma página que já saiu de tela.
 */
export function usePageHeader(title: string, options?: UsePageHeaderOptions): void {
  const setPageHeader = usePageHeaderStore((s) => s.setPageHeader)
  const resetPageHeader = usePageHeaderStore((s) => s.resetPageHeader)
  const { subtitle, onBack } = options ?? {}

  useEffect(() => {
    setPageHeader({ title, subtitle, onBack })
    return () => resetPageHeader()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, subtitle, onBack])
}
