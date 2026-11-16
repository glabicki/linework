import TextPage from "@/components/TextPage";

export const metadata = { title: "Privacy · Linework" };

// Written for Linework as it is now: no accounts, nothing stored off the phone.
export default function Privacy() {
  return (
    <TextPage title="Privacy" sub="The short version." after="If that ever changes, this page will say so first." items={[
      ["What we keep", "Nothing. Your rides, with any times and stations you add, stay on this phone. We never see them."],
      ["What we don’t", "Your location, contacts or OMNY card. No ads, and no tracking across apps."],
      ["Where it lives", "In this phone’s browser storage. Save a backup file from Account to keep a copy."],
      ["Deleting it", "Account, then Erase this phone, removes every ride and print."],
      ["Our host", "Like any website, the server that sends you Linework sees basic request details, such as your IP address. It never sees your rides."],
      ["MTA data", "Routes, stations and scheduled times come from the MTA’s public GTFS feed. Linework isn’t made by or affiliated with the MTA."],
      ["Terms", "The rules, in plain words", "/terms"],
    ]} />
  );
}
