'use client'
import { useEditorStore } from '@/hooks/useEditorStore'
import { PageView } from '@/app/p/[slug]/PageView'

export function EditorPreview() {
  const { page, previewDevice, previewLang } = useEditorStore()

  if (!page) return null

  const widths: Record<string, string> = {
    mobile: '390px',
    tablet: '768px',
    desktop: '100%',
  }
  const width = widths[previewDevice] || '390px'

  return (
    <div
      className="flex flex-col items-center overflow-auto"
      style={{ background: '#E5E7EB', borderLeft: '1px solid rgba(26,27,28,0.09)' }}
    >
      {/* Device label */}
      <div className="text-xs font-medium py-2 flex-shrink-0" style={{ color: '#9A9D9F' }}>
        {previewDevice === 'mobile' ? '📱 390px' : previewDevice === 'tablet' ? '📱 768px' : '🖥️ Escritorio'}
      </div>

      {/* Preview container */}
      <div
        className="bg-white overflow-auto shadow-xl flex-shrink-0"
        style={{
          width,
          maxWidth: '100%',
          minHeight: '80vh',
          borderRadius: previewDevice !== 'desktop' ? '32px' : '0',
          border: previewDevice !== 'desktop' ? '8px solid #1A1B1C' : 'none',
          transition: 'width 0.3s ease, border-radius 0.3s ease',
        }}
      >
        <PageView page={{ ...page, settings: { ...page.settings, defaultLang: previewLang } }} />
      </div>

      <div className="py-4 text-xs" style={{ color: '#9A9D9F' }}>
        linkhub.app/p/{page.slug}
      </div>
    </div>
  )
}
