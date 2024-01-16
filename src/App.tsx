import { RouterProvider, createBrowserRouter } from "react-router-dom";
import PlanPage from "./pages/Plan/Plan";
import CreatePlan from "./pages/Create/Create";
import { MantineProvider } from "@mantine/core";

const router = createBrowserRouter([
	{
		// it renders this element
		element: <PlanPage />,

		// when the URL matches this segment
		path: "/",

		// with this data loaded before rendering
		/* loader: async ({ request, params }) => {
			return fetch(`/fake/api/teams/${params.teamId}.json`, { signal: request.signal });
		}, */

		// performing this mutation when data is submitted to it
		/* action: async ({ request }) => {
			return updateFakeTeam(await request.formData());
		}, */

		// and renders this element in case something went wrong
		/* errorElement: <ErrorBoundary />, */
	},
	{
		element: <CreatePlan />,
		path: "/create",
	},
]);

function App() {
	return <RouterProvider router={router} />;
}

export default App;
