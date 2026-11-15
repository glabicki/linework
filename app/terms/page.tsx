import TextPage from "@/components/TextPage";

export const metadata = { title: "Terms · Linework" };

export default function Terms() {
  return (
    <TextPage title="Terms" sub="In plain words." back="/privacy" items={[
      ["It’s free", "Linework costs nothing and shows no ads."],
      ["Your rides are yours", "Export them any time, or delete them for good."],
      ["Times are estimates", "Minutes come from MTA schedules, not your actual trip, so treat them as “about”."],
      ["Prints are for you", "Save them, print them, hang them, share them."],
      ["Not the MTA", "Linework isn’t made by or affiliated with the MTA. Line colors and routes come from its public data."],
      ["Provided as is", "We’ll keep it working, but can’t promise it never breaks."],
    ]} />
  );
}
