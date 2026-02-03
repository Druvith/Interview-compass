from pydantic import BaseModel, Field


class PromptConfig(BaseModel):
    prompt_version: str = "v1"
    prompt_text: str
    rubric: list[str]


class RubricScore(BaseModel):
    label: str
    score: int = Field(ge=1, le=5)
    rationale: str


class AnalysisResult(BaseModel):
    rubric: list[RubricScore]
    overall_summary: str


class AnalysisResponse(BaseModel):
    analysis: AnalysisResult
    cached: bool = False
    model: str
    video_hash: str
