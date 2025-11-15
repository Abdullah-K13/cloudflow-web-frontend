import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen bg-white flex">
      {/* Left side - 53% */}
      <div className="w-[53%] flex items-center justify-center pl-2 pr-1 py-4">
        <div className="w-full h-full rounded-[10px] relative bg-gray-100">
          <Image
            src="/logo.png"
            alt="Cloud Flow"
            fill
            className="object-cover rounded-[10px]"
            priority
            style={{
              borderRadius: '10px',
            }}
          />
        </div>
      </div>

      {/* Right side - 47% */}
      <div className="w-[47%] bg-white flex flex-col items-center justify-center p-6">
        {/* Logo */}
        <div className="mb-2 self-start ml-32">
          <Image
            src="/bit.png"
            alt="Logo"
            width={48}
            height={48}
          />
        </div>
        {children}
      </div>
    </div>
  );
}