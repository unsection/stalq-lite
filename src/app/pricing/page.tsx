import { Button } from "@/components/ui/Button";

const plans = [
  {
    name: "Starter",
    price: 12,
    pages: 20,
  },
  {
    name: "Growth",
    price: 29,
    pages: 55,
  },
] as const;

const PricingPage = () => {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Pricing</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Simple plans for monitoring product pages at scale.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className="flex flex-col rounded-lg border border-zinc-900 bg-zinc-950 p-6"
          >
            <h2 className="text-lg font-medium text-white">{plan.name}</h2>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
              <span className="num">${plan.price}</span>
              <span className="text-base font-normal text-zinc-500">/mo</span>
            </p>
            <p className="mt-4 text-sm text-zinc-400">
              {plan.pages} monitored pages
            </p>
            <Button
              className="mt-6 w-full"
              disabled
              aria-label={`${plan.name} plan — Coming Soon`}
            >
              Coming Soon
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingPage;
