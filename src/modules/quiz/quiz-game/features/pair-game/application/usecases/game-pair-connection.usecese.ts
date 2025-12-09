import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class GamePairConnectionCmd extends Command<string> {}

@CommandHandler(GamePairConnectionCmd)
export class GamePairConnectionHandler
  implements ICommandHandler<GamePairConnectionCmd>
{
  async execute(
    cmd: GamePairConnectionCmd,
  ): Promise<GamePairConnectionCmd> {
    return '';
  }
}
