export function LoadingState() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-black dark:text-white">로딩 중...</p>
      </div>
    </div>
  )
}
