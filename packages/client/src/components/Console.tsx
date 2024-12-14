export default function Console({ message }: { message: string }) {
  return (
    <div className="text-white text-2xl bg-white border border-8 border-gray-500 border-double rounded-lg w-full h-full p-2">
      <div className="text-black">{message}</div>
    </div>
  );
}
