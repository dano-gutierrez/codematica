import { render } from "@testing-library/react-native";
import { useLocalSearchParams } from "expo-router";
import { InterviewQuestionScreen } from "@codematica/ui";
import InterviewQuestionRoute from "../../app/interviews/[collection]/[question]";

jest.mock("expo-router", () => ({ useLocalSearchParams: jest.fn(), Redirect: jest.fn(() => null) }));
jest.mock("@codematica/ui", () => ({ InterviewQuestionScreen: jest.fn(() => null) }));
jest.mock("../lib/adapters", () => ({ useCodematicaAdapters: () => ({ navigation: { navigate: jest.fn() } }) }));

describe("native interview path selection", () => {
  beforeEach(() => jest.clearAllMocks());

  it.each(["coding-interview-pattern-practice", undefined, "", "unknown", "__proto__", "toString"])("selects only an authored continuation for path %s", async (path) => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ collection: "amazon", question: "two-sum-product-pair", path });
    await render(<InterviewQuestionRoute />);
    const props = (InterviewQuestionScreen as jest.Mock).mock.calls[0][0];
    expect(props.question.slug).toBe("two-sum-product-pair");
    expect(props.nextHref).toBe(path === undefined || path === "coding-interview-pattern-practice"
      ? "/interviews/apple/validate-parentheses-stream?path=coding-interview-pattern-practice"
      : undefined);
  });
});
