import { useMemo } from 'react';
import type { CurrencyAssetItem } from '@/api/custom';
import AssetCompareBarCard from './AssetCompareBarCard';
import { AssetTypes } from '@/validation/deposit';

type AssetCurrencyBarCardProps = {
  data: CurrencyAssetItem[];
};

const AssetProductBarCard = (props: AssetCurrencyBarCardProps) => {
  const { data } = props;

  const chartData = useMemo(
    () =>
      data.map((item) => ({
        name: AssetTypes.find((it) => it.value === item.target)?.label || item.target,
        current: item.amount,
        previous: item.amount - item.change,
        change: item.change,
      })),
    [data],
  );

  return (
    <AssetCompareBarCard
      title="资产类型对比"
      data={chartData}
      colors={['#5b8fb9', '#7f9c8d']}
    />
  );
};

export default AssetProductBarCard;
