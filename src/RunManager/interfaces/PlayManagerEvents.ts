import {PlaybackManager} from "../PlaybackManager";

export interface PlaybackManagerEvents {
    stateChanged: (manager: PlaybackManager) => void;
}
