interface StatsProps {
  projectCount: number;
  daysBuilding: number;
  updatesCount: number;
}

export default function Stats({ projectCount, daysBuilding, updatesCount }: StatsProps) {
  return (
    <div className="flex justify-center gap-8 py-8 border-y border-gray-200 max-w-4xl mx-auto">
      <div className="text-center">
        <div className="text-3xl font-bold">{projectCount}</div>
        <div className="text-xs text-gray-600 mt-1">Projects</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold">{daysBuilding}</div>
        <div className="text-xs text-gray-600 mt-1">Days</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold">{updatesCount}</div>
        <div className="text-xs text-gray-600 mt-1">Updates</div>
      </div>
    </div>
  );
}
