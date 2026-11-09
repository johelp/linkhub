export default function Loading() {
  const bar = 'rounded-2xl animate-pulse bg-[rgba(26,27,28,0.06)]'
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1180px] mx-auto" aria-busy="true" aria-label="Cargando">
      <div className={`${bar} h-8 w-56 mb-8`} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">{[1, 2, 3, 4].map(i => <div key={i} className={`${bar} h-32`} />)}</div>
      <div className="grid gap-4 md:grid-cols-2">{[1, 2, 3, 4].map(i => <div key={i} className={`${bar} h-52`} />)}</div>
    </div>
  )
}
