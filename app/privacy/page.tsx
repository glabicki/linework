import TextPage from "@/components/TextPage";

export const metadata = { title: "Privacy · Linework" };

export default function Privacy() {
  return (
    <TextPage title="Privacy" sub="The short version." after="Both are also on the web, so you can read them before you sign up." items={[
      ["What we keep", "Your rides: the line, the day, and any time or stations you add. Your email, if you make an account."],
      ["What we don’t", "Your location, contacts or OMNY card. No ads, and no tracking across apps."],
      ["Where it lives", "On this phone. With an account, also backed up, so a new phone gets it."],
      ["Deleting it", "Account, then Delete account, erases everything from our servers and this phone."],
      ["MTA data", "Routes, stations and scheduled times come from the MTA’s public GTFS feed. Linework isn’t made by or affiliated with the MTA."],
      ["Terms", "The rules, in plain words", "/terms"],
    ]} />
  );
}
