interface StatsProps {
  projectCount: number;
  daysBuilding: number;
  updatesCount: number;
}

export default function Stats({ projectCount, daysBuilding, updatesCount }: StatsProps) {
  return (
    <div className="flex justify-center gap-12 py-12 flex-wrap">
      <div className="text-center">
        <div className="text-4xl font-bold">{projectCount}</div>
        <div className="text-sm text-gray-600 mt-1">Projects Built</div>
      </div>
      <div className="text-center">
        <div className="text-4xl font-bold">{daysBuilding}</div>
        <div className="text-sm text-gray-600 mt-1">Days Building</div>
      </div>
      <div className="text-center">
        <div className="text-4xl font-bold">{updatesCount}</div>
        <div className="text-sm text-gray-600 mt-1">Updates Posted</div>
      </div>
    </div>
  );
}
