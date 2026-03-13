export default function LoadingSpinner({ size = 'md' }) {
  const sizes = { sm: 'w-5 h-5 border-2', md: 'w-8 h-8 border-3', lg: 'w-12 h-12 border-4' };
  return (
    <div className="flex items-center justify-center py-20">
      <div className={`${sizes[size] || sizes.md} border-gray-200 border-t-gold rounded-full animate-spin`} />
    </div>
  );
}
