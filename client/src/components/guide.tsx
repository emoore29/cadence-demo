import { TextInput, Button } from "@mantine/core";
import { useForm } from "@mantine/form";

interface GuideProps {
  setGuide: React.Dispatch<React.SetStateAction<boolean>>;
  setWelcome: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Guide({ setGuide, setWelcome }: GuideProps) {
  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      accessToken: "",
    },
  });
  return (
    <div>
      <h1>Cadence</h1>
      <p>Cadence started development on 24 October 2024.</p>
      <p>
        It was designed to use Spotify's web API, and is reliant on the Audio
        Features and Get Recommendations endpoints.
      </p>
      <p>
        On 27 November 2024, these endpoints were deprecated without warning.
      </p>
      <p>
        If you have an access token that still provides access to those
        endpoints, you can view Cadence's full functionality by entering it
        below.
      </p>
      <form
        onSubmit={form.onSubmit((values) => {
          localStorage.setItem("access_token", values.accessToken);
          setGuide(false);
          setWelcome(false);
        })}
      >
        <TextInput
          key={form.key("accessToken")}
          {...form.getInputProps("accessToken")}
          label="Access token"
        />
        <Button type="submit">Submit</Button>
      </form>

      <p>
        Otherwise, you can view a demo of the intended functionality that uses
        mock data.
      </p>
      <Button>View Demo</Button>
    </div>
  );
}
