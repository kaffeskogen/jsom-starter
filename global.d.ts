declare namespace SP {
    interface ClientRuntimeContext {
      execute(): Promise<void>;
    }

    interface ListItem {
      systemUpdate: (b?: boolean) => void;
    }
}