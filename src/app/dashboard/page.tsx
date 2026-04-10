import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Globe, Eye, EyeOff, Edit2, QrCode } from 'lucide-react'
import { PLAN_LIMITS } from '@/types'
import { formatDate, formatNumber } from '@/lib/utils'
import { NewPageButton } from './NewPageButton'

export const metadata = { title: 'Mis páginas | LinkHub' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [{ data: profile }, { data: pages }] = await Promise.all([
    supabase.from('profiles').select('plan').eq('id', user.id).single(),
    supabase.from('pages_summary').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
  ])

  const plan = profile?.plan || 'free'
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]
  const pageList = pages || []
  const canCreate = pageList.length < limits.pages

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{color:'#1A1B1C'}}>Mis páginas</h1>
          <p className="text-sm mt-0.5" style={{color:'#9A9D9F'}}>
            {pageList.length} {pageList.length === 1 ? 'página' : 'páginas'}
            {plan === 'free' && ` · Plan Free (máx. ${limits.pages})`}
          </p>
        </div>
        <NewPageButton canCreate={canCreate} plan={plan} />
      </div>

      {/* Upgrade banner for Free */}
      {plan === 'free' && (
        <div className="mb-5 rounded-xl px-4 py-3 flex items-center justify-between" style={{background:'#FEF0EF',border:'1px solid #E8150A22'}}>
          <div>
            <p className="text-sm font-semibold" style={{color:'#E8150A'}}>
              ¿Necesitás temporadas, idiomas o más bloques?
            </p>
            <p className="text-xs mt-0.5" style={{color:'#B50F07'}}>
              Pasate a Pro y desbloqueá todos los bloques por €19/mes
            </p>
          </div>
          <Link href="/dashboard/upgrade" className="text-xs font-bold text-white px-4 py-2 rounded-full flex-shrink-0"
            style={{background:'#E8150A'}}>
            Ver Pro →
          </Link>
        </div>
      )}

      {/* Pages grid */}
      {pageList.length === 0 ? (
        <EmptyState canCreate={canCreate} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pageList.map((page: any) => (
            <PageCard key={page.id} page={page} />
          ))}
          {canCreate && <NewPageCard />}
        </div>
      )}
    </div>
  )
}

function PageCard({ page }: { page: any }) {
  const accentColor = page.primary_color || '#E8150A'
  return (
    <div className="bg-white rounded-2xl overflow-hidden group" style={{border:'1px solid rgba(26,27,28,0.09)'}}>
      {/* Color bar */}
      <div className="h-2" style={{background: accentColor}} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate" style={{color:'#1A1B1C'}}>{page.name}</h3>
            <p className="text-xs mt-0.5 truncate" style={{color:'#9A9D9F'}}>
              linkhub.app/p/{page.slug}
            </p>
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${
            page.published ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {page.published ? '● Publicada' : '○ Borrador'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs mb-4" style={{color:'#9A9D9F'}}>
          <span>{page.block_count} bloques</span>
          <span>·</span>
          <span>{formatNumber(page.views)} vistas</span>
          <span>·</span>
          <span>{formatDate(page.updated_at)}</span>
        </div>

        <div className="flex gap-2">
          <Link href={`/editor/${page.id}`}
            className="flex-1 text-center text-xs font-semibold py-2 rounded-lg transition-colors"
            style={{background:'#FEF0EF',color:'#E8150A'}}>
            <Edit2 size={12} className="inline mr-1"/>Editar
          </Link>
          {page.published && (
            <Link href={`/p/${page.slug}`} target="_blank"
              className="flex items-center justify-center px-3 py-2 rounded-lg transition-colors"
              style={{background:'#F6F6F5',color:'#5A5D60'}}>
              <Globe size={13}/>
            </Link>
          )}
          <Link href={`/dashboard/qr/${page.id}`}
            className="flex items-center justify-center px-3 py-2 rounded-lg transition-colors"
            style={{background:'#F6F6F5',color:'#5A5D60'}}>
            <QrCode size={13}/>
          </Link>
        </div>
      </div>
    </div>
  )
}

function NewPageCard() {
  return (
    <Link href="/dashboard/new" className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center gap-2 min-h-[160px] transition-colors hover:border-red"
      style={{border:'1.5px dashed rgba(26,27,28,0.15)'}}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'#FEF0EF'}}>
        <Plus size={20} style={{color:'#E8150A'}}/>
      </div>
      <span className="text-sm font-medium" style={{color:'#5A5D60'}}>Nueva página</span>
    </Link>
  )
}

function EmptyState({ canCreate }: { canCreate: boolean }) {
  return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">🔗</div>
      <h2 className="font-bold text-lg mb-2" style={{color:'#1A1B1C'}}>Todavía no tenés páginas</h2>
      <p className="text-sm mb-6" style={{color:'#9A9D9F'}}>Creá tu primera página de enlaces en menos de 2 minutos</p>
      {canCreate && (
        <Link href="/dashboard/new" className="inline-flex items-center gap-2 text-sm font-semibold text-white px-6 py-3 rounded-full"
          style={{background:'#E8150A'}}>
          <Plus size={16}/> Crear mi primera página
        </Link>
      )}
    </div>
  )
}
